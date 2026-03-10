import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Item from "@/models/item"
import SalesInvoice from "@/models/salesInvoice"

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
      await Item.findByIdAndUpdate(product._id, {
        $inc: { stockQuantity: -item.quantity }
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