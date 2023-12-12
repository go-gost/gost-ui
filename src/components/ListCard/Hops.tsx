import { hops } from "../../api";
import { HopConfig } from "../../api/types";
import ListCard from ".";
import viewChain from "../viewer/chain";
import { useContext } from "react";
import Ctx from "../../uitls/ctx";
import viewHop from "../viewer/hop";

const HopsCard: React.FC = (props) => {
  const { gostConfig } = useContext(Ctx);
  return (
    <ListCard
      module="hop"
      renderConfig={(value: any, record: HopConfig, index: number) => {
        return viewHop.call(gostConfig!, record);
      }}
    ></ListCard>
  );
};
export default HopsCard;
