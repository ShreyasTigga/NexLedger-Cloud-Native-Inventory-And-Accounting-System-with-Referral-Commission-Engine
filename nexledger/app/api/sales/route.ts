import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import SalesInvoice from "@/models/salesInvoice"
import StockMovement from "@/models/stockMovement"

export async function POST(req: NextRequest) {
  try {

    await dbConnect()

    const { items, customerName } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

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

      totalAmount += item.price * item.quantity

      // Reduce stock
      await StockMovement.create({
        itemId: product._id,
        type: "sale",
        quantity: -item.quantity,
        reference: "Sales Invoice"
      })
    }

    const invoice = await SalesInvoice.create({
      customerName,
      items: items.map((i: any) => ({
        itemId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price
      })),
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

export async function GET() {

  await dbConnect()

  const invoices = await SalesInvoice.find()
    .sort({ createdAt: -1 })
    .limit(10)

  const totalRevenue = await SalesInvoice.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" }
      }
    }
  ])

  const totalSales = await SalesInvoice.countDocuments()

  return NextResponse.json({
    invoices,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalSales
  })
}