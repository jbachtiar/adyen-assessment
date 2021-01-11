import React from "react";
import {
  Nav,
  Navbar,
  NavDropdown,
  Form,
  FormControl,
  Button,
} from "react-bootstrap";
import ShoppingCart from "./ShoppingCart.js";
import { useHistory } from "react-router-dom";

function NavBar() {
  const history = useHistory();
  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">Online Shop</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="#home">Shop</Nav.Link>
            <Nav.Link href="#link">Sales</Nav.Link>
          </Nav>
          <Form inline>
            <Button
              onClick={() => history.push("/cart")}
              variant="outline-success"
            >
              Cart
            </Button>
          </Form>
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
}

export default NavBar;
