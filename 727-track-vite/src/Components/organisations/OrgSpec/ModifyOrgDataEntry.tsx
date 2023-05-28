import { Input } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import React, { useEffect } from "react";
import ImageSelection from "../CreateOrg/ImageSelection.js";
import { MessageInstance } from "antd/es/message/interface.js";

interface OrgDataEntryProps {
  // React Setters
  setTitleQuery: React.Dispatch<React.SetStateAction<string | undefined>>;
  setFileName: React.Dispatch<React.SetStateAction<string>>;
  setImage: React.Dispatch<React.SetStateAction<File | undefined>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setHasModif: React.Dispatch<React.SetStateAction<boolean>>;

  // States
  orgNameExists: boolean;
  messageApi: MessageInstance;
  fileName: string;
  image: File | undefined;
  title: string;
  description: string;

  // Methods
  selectImage: (
    messageApi: MessageInstance,
    setFileName: React.Dispatch<React.SetStateAction<string>>,
    setImage: React.Dispatch<React.SetStateAction<File | undefined>>
  ) => void;
}

function ModifyOrgDataEntry(props: OrgDataEntryProps) {
  useEffect(() => {
    if (props.image != null) props.setHasModif(true);
  }, [props.image]);

  const { TextArea } = Input;
  return (
    <>
      <div className="w-full flex justify-center mt-5">
        <div className="flex md:justify-between flex-col md:flex-row w-11/12">
          {/* Title */}
          <div className=" w-full flex-shrink mr-5 md:max-w-[45rem]">
            <p className="font-bold">Titre</p>
            <Input
              placeholder="Mon titre important"
              showCount
              defaultValue={props.title}
              maxLength={100}
              className="w-full"
              onChange={(evt) => {
                props.setHasModif(true);
                props.setTitleQuery(evt.target.value);
              }}
            />
            <p className={`${props.orgNameExists ? "" : "hidden"}`}>
              <WarningOutlined /> Cette organisation existe déjà
            </p>
          </div>

          <ImageSelection
            selectImage={props.selectImage}
            messageApi={props.messageApi}
            setFileName={props.setFileName}
            setImage={props.setImage}
            fileName={props.fileName}
            image={props.image}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-5 flex flex-col justify-center">
        <div className="flex justify-center">
          <p className="font-bold w-11/12">Description</p>
        </div>

        <div className="flex-grow flex justify-center items-center">
          <TextArea
            onChange={(evt) => {
              props.setDescription(evt.target.value);
              props.setHasModif(true);
            }}
            defaultValue={props.description}
            className="w-11/12 h-72"
            style={{ resize: "none" }}
            maxLength={1000}
            showCount
            placeholder="Ma description importante"
          />
        </div>
      </div>
    </>
  );
}

export default ModifyOrgDataEntry;
