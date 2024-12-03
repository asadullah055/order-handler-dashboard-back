/* {
    $expr: {
      $eq: [
        {
          $substr: [
            "$orderNumber",
            {
              $cond: [
                { $lt: [{ $strLenCP: "$orderNumber" }, 4] },
                0,
                { $subtract: [{ $strLenCP: "$orderNumber" }, 4] },
              ],
            },
            4,
          ],
        },
        orderNumber.slice(-4),
      ],
    },
  }, */
