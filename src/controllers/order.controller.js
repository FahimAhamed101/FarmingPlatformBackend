const { StatusCodes } = require("http-status-codes");

const Order = require("../models/Order");
const Produce = require("../models/Produce");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

const createOrder = asyncHandler(async (req, res) => {
  const { produceId, quantity } = req.body;
  const qty = Number(quantity);

  if (!qty || qty < 1) {
    const error = new Error("Order quantity must be at least 1.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "INVALID_QUANTITY";
    throw error;
  }

  const produce = await Produce.findOne({
    _id: produceId,
    isActive: true,
    certificationStatus: "approved",
  });

  if (!produce) {
    const error = new Error("Produce item is unavailable for ordering.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "PRODUCE_UNAVAILABLE";
    throw error;
  }

  if (produce.availableQuantity < qty) {
    const error = new Error("Insufficient produce quantity available.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "INSUFFICIENT_INVENTORY";
    throw error;
  }

  const order = await Order.create({
    userId: req.user._id,
    produceId: produce._id,
    vendorId: produce.vendorId,
    quantity: qty,
    totalPrice: produce.price * qty,
    status: "pending",
  });

  produce.availableQuantity -= qty;
  if (produce.availableQuantity === 0) {
    produce.isActive = false;
  }
  await produce.save();

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: "Order created successfully.",
    data: order,
  });
});

const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const filter = {};

  if (req.user.role === "customer") {
    filter.userId = req.user._id;
  }

  if (req.user.role === "vendor") {
    filter.vendorId = req.user._id;
  }

  if (status) {
    filter.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("userId", "name email")
      .populate("vendorId", "name email")
      .populate("produceId", "name price")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Orders fetched successfully.",
    data: orders,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.orderId);
  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "ORDER_NOT_FOUND";
    throw error;
  }

  if (req.user.role === "vendor" && order.vendorId.toString() !== req.user._id.toString()) {
    const error = new Error("You can only update orders linked to your produce.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  if (!["pending", "confirmed", "cancelled", "delivered"].includes(status)) {
    const error = new Error("Invalid order status.");
    error.statusCode = StatusCodes.BAD_REQUEST;
    error.code = "INVALID_ORDER_STATUS";
    throw error;
  }

  if (status === "cancelled" && order.status !== "cancelled") {
    const produce = await Produce.findById(order.produceId);
    if (produce) {
      produce.availableQuantity += order.quantity;
      produce.isActive = true;
      await produce.save();
    }
  }

  order.status = status;
  await order.save();

  return sendSuccess(res, {
    message: "Order status updated successfully.",
    data: order,
  });
});

module.exports = {
  createOrder,
  listOrders,
  updateOrderStatus,
};
