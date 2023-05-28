import { Button } from "antd";
import { SearchOutlined, ArrowRightOutlined } from "@ant-design/icons";

import React from "react";

interface WelcomeScreenProps {
  handleConnection: () => void;
}

function WelcomeScreen(props: WelcomeScreenProps) {
  return (
    <div className="h-screen min-h-[40em] flex flex-col justify-center items-center md:items-start">
      <p className="text-3xl md:text-5xl font-bold mt-4 ml-8 w-[25rem] text-center md:text-left">
        Bienvenue sur 727-tracker <span className="text-4xl"> ✈️ </span>
      </p>
      <p className="text-lg font-medium mt-2 ml-8 text-center md:text-left w-[25rem]">
        Connectez vous avec Google pour continuer
      </p>
      <Button
        onClick={props.handleConnection}
        type="primary"
        className="md:w-72 w-96 m-4 ml-8 h-16"
      >
        Continuer avec Google
        <ArrowRightOutlined />
      </Button>
    </div>
  );
}

export default WelcomeScreen;
