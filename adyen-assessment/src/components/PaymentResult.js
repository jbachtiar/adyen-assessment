import React, { useEffect, useState } from "react";
import QueryString from "query-string";
import axios from "axios";
// import { response } from "express";
import { reactLocalStorage } from "reactjs-localstorage";

function PaymentResult() {
  const api = "http://localhost:5000";
  const [result, setResult] = useState("");
  const [refusalCode, setRefusalCode] = useState("");
  // var refusalCode = "";
  useEffect(() => {
    console.log("hello");
    console.log(reactLocalStorage.get("paymentData"));
    const param = QueryString.parse(window.location.search);
    console.log(param);
    if (param.paymentResult) {
      setResult(param.paymentResult);
      if ((param.paymentResult = "Refused")) {
        console.log("refuse");
        setRefusalCode(param.refusalCode);
        console.log(refusalCode);
      }
    }
    if (param.payload) {
      getPaymentDetails(param.payload, reactLocalStorage.get("paymentData"));
    }
  }, []);

  function getPaymentDetails(param, paymentData) {
    axios
      .post(api + "/api/additionalDetails", {
        param: param,
        paymentData: paymentData,

        // threeds2fingerprint: state.data.details.threeds2.fingerprint,
      })
      .then((res) => {});
  }
  if (result == "Authorised") {
    return <div>Payment Successful</div>;
  }
  if (result == "Refused") {
    return <div>Payment failed because {refusalCode}</div>;
  } else {
    return <div></div>;
  }
}

export default PaymentResult;
