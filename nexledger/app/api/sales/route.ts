import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import SalesInvoice from "@/models/salesInvoice"
import StockMovement from "@/models/stockMovement"

export async function GET() {
  try {
    await dbConnect()

    const invoices = await SalesInvoice.find()
      .sort({ createdAt: -1 })
      .limit(10)

    const totalRevenueData = await SalesInvoice.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ])

    const totalRevenue = totalRevenueData[0]?.total || 0

    const totalSales = await SalesInvoice.countDocuments()

    return NextResponse.json({
      invoices,
      totalRevenue,
      totalSales
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {

    await dbConnect()

    const { items, customerId } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    const processedItems = []
    let totalAmount = 0

    for (const item of items) {

      const product = await Item.findById(item.productId)

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        )
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${product.name}` },
          { status: 400 }
        )
      }

      const price = product.sellingPrice
      const taxRate = product.taxRate

      const base = price * item.quantity

      const cgst = taxRate / 2
      const sgst = taxRate / 2

      const cgstAmount = (base * cgst) / 100
      const sgstAmount = (base * sgst) / 100

      const gstAmount = cgstAmount + sgstAmount
      const total = base + gstAmount

      totalAmount += total

      processedItems.push({
        itemId: product._id,
        name: product.name,
        quantity: item.quantity,
        price,
        taxRate,
        cgst,
        sgst,
        gstAmount,
        total
      })

      // ✅ Reduce stock (ONLY ONCE)
      await Item.findByIdAndUpdate(product._id, {
        $inc: { stockQuantity: -item.quantity }
      })

      // ✅ Log stock movement
      await StockMovement.create({
        itemId: product._id,
        type: "sale",
        quantity: -item.quantity,
        reference: "Sales Invoice"
      })
    }

    const invoice = await SalesInvoice.create({
      customerId,
      items: processedItems,
      totalAmount
    })

    return NextResponse.json(invoice, { status: 201 })

  } catch (err: any) {

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )

  }
}