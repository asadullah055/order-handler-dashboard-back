const { secretKey } = require("../../secret");
const createJsonwebtoken = require("../helper/createJWT");
const sellerModel = require("../model/sellerModel");
const createError = require("http-errors");
const bcrypt = require("bcryptjs");
const { successMessage } = require("../utill/respons");
const { uploadToCloudinary } = require("../helper/cloudinary");
const formidable = require("formidable");
class sellerController {
  registration_seller = async (req, res, next) => {
    try {
      const { email } = req.body;
      const exitUser = await sellerModel.exists({ email: email });
      if (exitUser) {
        throw createError(409, "Seller Already Exit");
      }
      const seller = await sellerModel.create(req.body);
      const token = await createJsonwebtoken(
        {
          id: seller.id,
          email: seller.email,
          role: seller.role,
        },
        secretKey,
        "7d"
      );
      res.cookie("accessToken", token, {
        maxAge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      /*  const sellerWithoutPassword = await sellerModel
        .findOne({ email })
        .select("-password"); */
      successMessage(res, 200, {
        token,
        message: "Registration success",
      });
    } catch (error) {
      console.log(error);

      next(error);
    }
  };
  login_seller = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const seller = await sellerModel.findOne({ email });

      if (!seller) {
        throw createError(404, "User not found");
      }
      const passwordMatch = await bcrypt.compare(password, seller.password);
      if (!passwordMatch) {
        throw createError(401, "Email/password din not match");
      }

      const token = await createJsonwebtoken(
        {
          id: seller.id,
          email: seller.email,
          role: seller.role,
        },
        secretKey,
        "7d"
      );
      res.cookie("accessToken", token, {
        maxAge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env !== "development",
        sameSite: "none",
      });

      successMessage(res, 200, {
        token,
        message: "Login success",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  get_seller = async (req, res, next) => {
    const { id } = req;

    try {
      const seller = await sellerModel.findById(id);
      successMessage(res, 200, { seller });
    } catch (error) {
      next(error);
    }
  };
  update_profile = async (req, res, next) => {
    const { id } = req;

    const form = formidable();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return next(err);
      }

      const { image } = files;
      const { shopName, name } = fields;

      try {
        let updateData = { shopName, name };

        // If an image file is provided, upload it to Cloudinary
        if (image) {
          const result = await uploadToCloudinary(
            image.filepath,
            "order_management"
          );

          // Add the image URL to updateData only if the upload succeeds
          if (result && result.url) {
            updateData.shopLogo = result.url;
          }
        }

        // Update the seller profile with or without the image URL
        await sellerModel.findByIdAndUpdate(id, updateData);

        const seller = await sellerModel.findById(id);
        successMessage(res, 200, {
          seller,
          message: "Profile updated successfully",
        });
      } catch (error) {
        console.log(error);
        next(error);
      }
    });
  };

  logout = async (req, res, next) => {
    try {
      res.clearCookie("accessToken");
      // success message
      successMessage(res, 200, { message: "Logout successfully" });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new sellerController();
