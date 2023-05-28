import { Button } from "antd";
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import notFound from "../../assets/Not_Found/404.png";
function Not_Found() {
  const navigate = useNavigate();
  return (
    <div className="h-screen w-screen flex items-center justify-center flex-col gap-5">
      <img src={notFound} className="w-52" />

      <p className="text-center text-3xl">
        Cette page existe autant que brodeur car en 2022.
      </p>
      <Button
        type="primary"
        className="text-center"
        onClick={() => {
          navigate("./");
        }}
      >
        Retourner au menu principal
      </Button>
    </div>
  );
}

export default Not_Found;
