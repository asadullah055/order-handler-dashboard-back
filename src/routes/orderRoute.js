
const express = require('express')
const orderController = require('../controller/orderController')

const orderRoute = express.Router() 

orderRoute.post('/add-order', orderController.add_order )
orderRoute.get('/all-order/:pageNo/:perPage', orderController.get_all_order )
orderRoute.get('/order/:orderNumber', orderController.get_single_order )
orderRoute.get('/status-order', orderController.get_status_order )


module.exports = orderRoute

