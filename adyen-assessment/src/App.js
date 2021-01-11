import logo from "./logo.svg";
import "./App.css";
import Content from "./components/Content";
import PaymentResult from "./components/PaymentResult";
import NavBar from "./components/NavBar";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <Router>
        <NavBar />
        <Switch>
          <Route component={Content} exact path={["/", "/cart"]} />
          <Route component={PaymentResult} path="/paymentResult" />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
