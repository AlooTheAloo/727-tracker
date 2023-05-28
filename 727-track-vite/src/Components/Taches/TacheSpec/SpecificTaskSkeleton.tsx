import { Button, Skeleton } from "antd";
import React, { useEffect } from "react";

function SpecificTaskSkeleton() {

  return (
    <div className="flex-grow w-full flex flex-col">
      <div className="flex flex-grow w-full h-full">
        <div className="md:w-3/4 w-full flex">
          <div className="flex-grow h-full md:ml-20 md:mx-0 mx-5">
            <div className="h-full w-full">
              <div className="flex flex-col justify-center h-full text-xl font-semibold gap-4">
                <div>
                  <Skeleton.Button active />
                  <div className="w-52">
                    <Skeleton.Button active block></Skeleton.Button>
                  </div>
                </div>

                <div>
                  <Skeleton.Button active />
                  <div>
                    <div className="md:w-3/4 w-full">
                      <Skeleton.Button
                        active
                        block
                        style={{ height: "10rem" }}
                      />
                    </div>
                  </div>
                </div>

                <div className={"md:w-3/4 w-full "}>
                  <Skeleton.Button active />
                  <br></br>
                  <Skeleton.Button block active></Skeleton.Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/4 md:block hidden"></div>
      </div>
      <hr className="border-[#707070] mx-5 md:mx-20" />
      <div
        className={
          "flex md:flex-row flex-col md:gap-2 items-center h-20 mx-5 md:mx-20 w-24"
        }
      >
        <Skeleton.Button block active />
      </div>
    </div>
  );
}

export default SpecificTaskSkeleton;
