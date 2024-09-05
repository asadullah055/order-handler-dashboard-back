
const express = require('express')
const orderController = require('../controller/orderController')

const orderRoute = express.Router() 

orderRoute.post('/add-order', orderController.add_order )
orderRoute.get('/all-order/:pageNo/:perPage', orderController.get_all_order )


module.exports = orderRoute

