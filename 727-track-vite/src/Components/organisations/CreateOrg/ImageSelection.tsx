import { Button } from "antd";
import React from "react";
import { UploadOutlined } from "@ant-design/icons";
import { MessageInstance } from "antd/es/message/interface.js";

interface ImageSelectionProps {
  selectImage: (
    messageApi: MessageInstance,
    setFileName: React.Dispatch<React.SetStateAction<string>>,
    setImage: React.Dispatch<React.SetStateAction<File | undefined>>
  ) => void;
  messageApi: MessageInstance;
  setFileName: React.Dispatch<React.SetStateAction<string>>;
  setImage: React.Dispatch<React.SetStateAction<File | undefined>>;
  fileName: string;
  image: File | undefined;
}
function ImageSelection(props: ImageSelectionProps) {
  return (
    <div>
      <p className="font-bold">Image</p>
      <Button
        className="w-full md:w-52"
        onClick={() => {
          props.selectImage(
            props.messageApi,
            props.setFileName,
            props.setImage
          );
        }}
        icon={<UploadOutlined />}
      >
        Téléverser
      </Button>
      <p className="md:text-center max-w-[] w-full md:w-52 text-ellipsis overflow-hidden whitespace-nowrap">
        {props.image == null ? "(Max. 5MB)" : props.fileName}
      </p>
    </div>
  );
}

export default ImageSelection;
