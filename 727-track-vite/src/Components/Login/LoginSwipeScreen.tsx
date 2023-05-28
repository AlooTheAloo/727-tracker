import { Carousel, Dropdown } from "antd";
import React from "react";
import { socket } from "../../App.js";
import LoginSwipeScreenFirstPage from "./LoginSwipeScreen/LoginSwipeScreenFirstPage.js";

function LoginSwipeScreen() {
  return (
    <>
      <div className="bg-white w-[40%] absolute h-96 rounded-2xl">
        <div>
          <Carousel
            effect="fade"
            autoplay={false}
            dots={false}
            dotPosition="bottom"
            className="h-96"
          >
            <LoginSwipeScreenFirstPage />
            {/* TODO : Add more pages if there is time
                        <LoginSwipeScreenSecondPage/>
                        <div className="">
                            Page 3
                        </div>
                    */}
          </Carousel>
        </div>
      </div>
    </>
  );
}

export default LoginSwipeScreen;
