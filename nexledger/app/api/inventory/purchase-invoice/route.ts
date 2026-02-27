import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import PurchaseInvoice from "@/models/purchaseInvoice"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { invoiceNumber, supplierName, items } =
      await req.json()

    if (!invoiceNumber || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid invoice data" },
        { status: 400 }
      )
    }

    let invoiceTotal = 0

    for (const item of items) {
      const product = await Item.findById(item.productId)

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        )
      }

      const oldQty = product.stockQuantity
      const oldCost = product.costPrice

      const newQty = item.quantity
      const newRate = item.purchasePrice

      const totalQty = oldQty + newQty

      let newCostPrice = newRate

      if (oldQty > 0) {
        newCostPrice =
          ((oldQty * oldCost) + (newQty * newRate)) / totalQty
      }

      await Item.findByIdAndUpdate(product._id, {
        stockQuantity: totalQty,
        costPrice: newCostPrice
      })

      invoiceTotal += newQty * newRate
    }

    const invoice = await PurchaseInvoice.create({
      invoiceNumber,
      supplierName,
      totalAmount: invoiceTotal,
      items
    })

    return NextResponse.json(invoice, { status: 201 })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}