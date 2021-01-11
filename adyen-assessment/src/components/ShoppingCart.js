import axios from "axios";
import React, { useState, useEffect } from "react";
import publicIp from "public-ip";
import { Table, Button, Modal } from "react-bootstrap";
import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";
import { reactLocalStorage } from "reactjs-localstorage";
import { useHistory } from "react-router-dom";

function ShoppingCart() {
  reactLocalStorage.set("paymentData", "");
  const items = { name: "Aw Shoes", price: 50, color: "white", qty: 2 };
  var client = {};
  const totalPrice = 100;
  const api = "http://localhost:5000";
  const webClientKey = "test_CIXAPNBW2JERLEJ6GYYC3WBLVMO2HIZ3";
  const history = useHistory();
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    axios.get("http://geolocation-db.com/json/").then((res) => {
      console.log(res.data);
      client = res.data;
    });
  });
  function pay() {
    handleShow();
    axios
      .post(api + "/api/getPaymentMethod", {
        countryCode: client.country_code,
      })
      .then(function (response) {
        // console.log(response);
        // console.log(response.data);
        console.log(client);
        const config = {
          paymentMethodsResponse: response.data,
          clientKey: webClientKey,
          locale: "en-US",
          environment: "test",
          onSubmit: (state, dropin) => {
            console.log(state);
            console.log(dropin);
            axios
              .post(api + "/api/initiatePayment", {
                amount: { currenct: "SGD", value: totalPrice },
                browserInfo: state.data.browserInfo,
                paymentMethod: state.data.paymentMethod,
                billingAddress: state.data.billingAddress,
                shopperIP: client.IPv4,
                shopperEmail: "testing@testing.com",
              })
              .then((res) => {
                console.log("hello");
                console.log(res);
                if (res.data.action) {
                  reactLocalStorage.set("paymentData", res.data.paymentData);
                  dropin.handleAction(res.data.action);
                } else {
                  //   console.log("payment done");
                  if (response.data.resultCode == "Authorised") {
                    alert("payment done");
                    history.push({
                      pathname: "/paymentResult",
                      search: "?paymentResult=" + response.data.resultCode,
                    });
                  } else {
                    console.log(response.data);
                    alert("fail" + response.data.refusalReason);
                    history.push({
                      pathname: "/paymentResult",
                      search:
                        "?paymentResult=" +
                        response.data.resultCode +
                        "&refusalCode=" +
                        response.data.refusalReason,
                    });
                  }
                  //   redirect to payment done page
                }
              })
              .catch((err) => {
                // throw Error(err);
                console.log(err);
              });
          },
          onAdditionalDetails: (state, dropin) => {
            // Your function calling your server to make a `/payments/details` request
            console.log("on additional details");
            console.log(state.data);
            axios
              .post(api + "/api/additionalDetails", {
                data: state.data,
                // threeds2fingerprint: state.data.details.threeds2.fingerprint,
              })
              .then((response) => {
                console.log(response);
                if (response.data.action) {
                  // Drop-in handles the action object from the /payments response

                  console.log("dropin2");
                  dropin.handleAction(response.data.action);
                } else {
                  // Your function to show the final result to the shopper
                  //   showFinalResult(response);
                  if (response.data.resultCode == "Authorised") {
                    alert("payment done");
                    history.push({
                      pathname: "/paymentResult",
                      search: "?paymentResult=" + response.data.resultCode,
                    });
                  } else {
                    alert("fail" + response.data.refusalReason);
                    history.push({
                      pathname: "/paymentResult",
                      search:
                        "?paymentResult=" +
                        response.data.resultCode +
                        "&refusalCode=" +
                        response.data.refusalReason,
                    });
                  }
                  //   alert("payment completed");
                }
              })
              .catch((error) => {
                // throw Error(error);
                console.log(error);
              });
          },
          paymentMethodsConfiguration: {
            card: {
              // Example optional configuration for Cards
              hasHolderName: true,
              holderNameRequired: true,
              enableStoreDetails: true,
              hideCVC: false, // Change this to true to hide the CVC field for stored cards
              name: "Credit or debit card",
              billingAddressRequired: true,
            },
          },
        };

        const checkout = new AdyenCheckout(config);
        const dropin = checkout.create("dropin").mount("#dropin-container");
      });
  }
  function push() {
    history.push("/paymentResult");
  }
  return (
    <div className="container">
      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Pay</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div id="dropin-container"></div>
        </Modal.Body>
      </Modal>
      <div>
        ShoppingCart
        <Button style={{ marginLeft: "10px" }} onClick={pay}>
          Pay
        </Button>
      </div>
      <Table responsive="sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>{items.name}</td>
            <td>{items.qty}</td>
            <td>${items.qty * items.price}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default ShoppingCart;
