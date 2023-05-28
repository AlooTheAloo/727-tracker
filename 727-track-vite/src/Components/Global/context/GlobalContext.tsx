import { createContext } from "react";
export const GlobalContext = createContext<contextType>({
  collapsed: true,
  setCollapsed: () => {},
  userName: "",
  setUserName: () => {},
  pfp: "",
  setPfp: () => {},
});

interface contextType {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  userName: string | undefined;
  setUserName: React.Dispatch<React.SetStateAction<string | undefined>>;

  pfp: string | undefined;
  setPfp: React.Dispatch<React.SetStateAction<string | undefined>>;
}
