//TO MODIFY (THIS IS JUST COPIED OR SLIGHT CHANGES)

import { Skeleton } from "antd";
import React from "react";

function CreateTacheSkeleton() {
  return (
    <div className="flex flex-col h-full w-full flex-grow">
      <div className="flex h-96 flex-grow w-full">
        <div className="flex-grow w-1/2 flex items-center">
          <div className="flex flex-col  justify-center ml-5 mr-5 md:ml-20 md:mr-20 lg:mr-0 h-full w-full lg:w-2/3 ">
            <div className="flex flex-col ">
              <div className="w-16">
                <Skeleton.Button block active />
              </div>
              <div className="w-2/3">
                <Skeleton.Button block active />
              </div>
              <b className="w-40 mt-5">
                <Skeleton.Button block active />
              </b>
              <div className="w-full">
                <Skeleton.Button block active style={{ height: "5rem" }} />
              </div>
              <b className="w-36 mt-5">
                <Skeleton.Button block active />
              </b>
              <div className="w-1/3">
                <Skeleton.Button block active />
              </div>
              <b className="w-48 mt-5">
                <Skeleton.Button block active />
              </b>
              <div className="w-full">
                <Skeleton.Button block active />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col justify-center  flex-grow w-2/5 mr-16">
          <div className="flex flex-col justify-between h-2/3 rounded-xl w-[calc(100% - 2.5rem)] mx-5 ">
            <Skeleton.Button block active style={{ height: "19rem" }} />
          </div>
        </div>
      </div>
      <hr className="border-[#707070] mx-5 md:mx-20" />

      <div className="h-1/5 mx-20 flex flex-col flex-grow">
        <div className="flex w-full h-full flex-grow items-center justify-center md:justify-start flex-col md:flex-row ">
          <div className="w-28">
            <Skeleton.Button active block />
          </div>

          <div className="w-28 mt-5 md:mt-0 md:ml-5 ">
            <Skeleton.Button active block />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTacheSkeleton;
