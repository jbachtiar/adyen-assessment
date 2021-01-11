const express = require("express");
var cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 5000;
app.use(cors());
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");

// Parse JSON bodies
app.use(express.json());
// // Parse URL-encoded bodies
// app.use(express.urlencoded({ extended: true }));
// // Serve client from build folder
// app.use(express.static(path.join(__dirname, "/public")));

const { response } = require("express");
const config = new Config();
config.apiKey =
  "AQEyhmfxLI3MaBFLw0m/n3Q5qf3VaY9UCJ14XWZE03G/k2NFitRvbe4N1XqH1eHaH2AksaEQwV1bDb7kfNy1WIxIIkxgBw==-y3qzswmlmALhxaVPNjYf74bqPotG12HroatrKA066yE=-W+t7NF;s4}%=kUSD";
config.merchantAccount = "AdyenRecruitmentCOM";
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/api/getPaymentMethod", async (req, res) => {
  try {
    const response = await checkout.paymentMethods({
      channel: "Web",
      merchantAccount: config.merchantAccount,
      countryCode: req.body.countryCode,
    });
    // console.log(res.json(response));
    res.json(response);
  } catch (err) {
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

// A temporary store to keep payment data to be sent in additional payment details and redirects.
// This is more secure than a cookie. In a real application this should be in a database.
const paymentDataStore = {};

app.post("/api/initiatePayment", async (req, res) => {
  if (req.body.paymentMethod.type == "wechatpayQR") {
    res.json(wechatpayQR(req));
  }
  try {
    // unique ref for the transaction
    const orderRef = uuidv4();
    // Ideally the data passed here should be computed based on business logic
    // console.log(req.headers.origin);
    // console.log(req.body.billingAddress);
    // console.log(req.body.shopperIP);
    // console.log(req.body.shopperEmail);
    const response = await checkout.payments({
      amount: { currency: "SGD", value: 1000 }, // value is 10€ in minor units
      reference: "Jeremy_checkoutChallenge", // required
      merchantAccount: config.merchantAccount, // required
      channel: "web", // required
      // we pass the orderRef in return URL to get paymentData during redirects
      returnUrl: `http://localhost:3000/paymentResult`, // required for redirect flow
      browserInfo: req.body.browserInfo, //not sure if needed
      paymentMethod: req.body.paymentMethod, // required
      billingAddress: req.body.billingAddress,
      additionalData: {
        allow3DS2: true,
      },
      shopperIP: req.body.shopperIP,
      shopperEmail: req.body.shopperEmail,
      origin: req.headers.origin,
      // accountInfo: {
      //   accountCreationDate: "2019-01-17T13:42:40+01:00",
      // },
    });
    console.log(response);
    const { action } = response;
    // console.log(action);
    if (action) {
      paymentDataStore[orderRef] = action.paymentData;

      // switch (action.type) {
      //   case "threeDS2Fingerprint":
      //     break;
      //   case "threeDS2Challenge":
      //     break;
      //   case "redirect":
      //     break;
      // }
    }
    res.json(response);
  } catch (err) {
    console.log("intiate");
    console.log(err);
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.status(err.statusCode).json(err.message);
  }
});

app.post("/api/additionalDetails", (req, res) => {
  // res.send("Redirect");
  console.log("additionaldetails");
  console.log(req.body);
  // console.log(req.body.data.details.threeds2.fingerprint);
  // console.log(req.body.data.details.threeds2.fingerprint);
  if (req.body.param) {
    console.log("parammm");

    console.log(req.body.param);
    console.log("paymentdata");

    console.log(req.body.paymentData);
    console.log("parammm");
    try {
      checkout
        .paymentsDetails({
          details: {
            redirectResult: req.body.param.payload,
            payload: req.body.param.payload,
          }, // Data object passed from onAdditionalDetails event of the front end
          paymentData: req.body.paymentData,
        })
        .then((response) => {
          console.log(response);
          console.log(req.body.param);
          console.log("parammm2");
          res.json(response);
        })
        .catch((err) => {
          console.log("err1");
          console.log(err);
        });
    } catch (err) {
      console.log(err);
    }
  } else {
    if (req.body.data.details["threeds2.fingerprint"]) {
      checkout
        .paymentsDetails({
          details: {
            "threeds2.fingerprint":
              req.body.data.details["threeds2.fingerprint"],
          }, // Data object passed from onAdditionalDetails event of the front end
          paymentData: req.body.data.paymentData,
        })
        .then((response) => {
          res = res.json(response);
        });
    }
    if (req.body.data.details["threeds2.challengeResult"]) {
      checkout
        .paymentsDetails({
          details: {
            "threeds2.challengeResult":
              req.body.data.details["threeds2.challengeResult"],
          }, // Data object passed from onAdditionalDetails event of the front end
          paymentData: req.body.data.paymentData,
        })
        .then((response) => {
          res = res.json(response);
        });
    }
  }
});

app.get("/api/handleShopperRedirect", (req, res) => {
  const orderRef = req.query.orderRef;
  const redirect = req.method === "GET" ? req.query : req.body;
  const details = {};
  if (redirect.redirectResult) {
    details.redirectResult = redirect.redirectResult;
  } else {
    details.MD = redirect.MD;
    details.PaRes = redirect.PaRes;
  }

  const payload = {
    details,
    paymentData: paymentDataStore[orderRef],
  };
  console.log(payload);
  try {
    checkout.paymentsDetails(payload).then((response) => {
      console.log("handle error/success");
      console.log(response);
      console.log(response.resultCode);

      switch (response.resultCode.toLowerCase()) {
        case "authorised":
          res.redirect("/result/success");
          break;
        case "pending":
        case "received":
          res.redirect("/result/pending");
          break;
        case "refused":
          res.redirect("/result/failed");
          break;
        default:
          res.redirect("/result/error");
          break;
      }
    });
    // Conditionally handle different result codes for the shopper
  } catch (err) {
    console.log("error");
    console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    res.redirect("/result/error");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

function wechatpayQR(req) {
  console.log("wechatpayQR");
  checkout
    .payments({
      paymentMethod: {
        type: "wechatpayQR",
      },
      amount: { currency: "SGD", value: 1000 }, // value is 10€ in minor units
      reference: "Jeremy_checkoutChallenge", // required
      merchantAccount: config.merchantAccount, // required
      channel: "web", // required
    })
    .then((res) => {
      console.log(res);
      return res;
    });
}
