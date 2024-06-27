import { hops } from "../../api";
import { HopConfig } from "../../api/types";
import ListCard from ".";
import viewChain from "../viewer/chain";
import { useContext } from "react";
import Ctx from "../../utils/ctx";
import {ViewHop} from "../viewer/hop";

const HopsCard: React.FC = (props) => {
  return (
    <ListCard
      module="hop"
      renderConfig={(value: any, record: HopConfig, index: number) => {
        // return viewHop.call(gostConfig!, record);
        return <ViewHop {...record} />;
      }}
    ></ListCard>
  );
};
export default HopsCard;
