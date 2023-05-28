import { Radio, RadioChangeEvent } from "antd";
import React, { useEffect } from "react";
import { UnorderedListOutlined, AppstoreOutlined } from "@ant-design/icons";
interface tacheStyleSelectorProps {
  onChange: (e: RadioChangeEvent) => void;
  selectedStyle: boolean;
}

function TacheStyleSelector(props: tacheStyleSelectorProps) {
  return (
    <div>
      <Radio.Group
        onChange={props.onChange}
        value={props.selectedStyle ? "grid" : "list"}
      >
        <Radio.Button value={"list"}>
          <UnorderedListOutlined />
        </Radio.Button>
        <Radio.Button value={"grid"}>
          <AppstoreOutlined />
        </Radio.Button>
      </Radio.Group>
    </div>
  );
}
export default TacheStyleSelector;
