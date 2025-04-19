import { MobileView } from "react-device-detect";

const MobileCheck = () => {
  return (
    <MobileView>
      <div
        className="backTranslation"
        style={{ padding: "2em", fontSize: "1.5em", textAlign: "center" }}
      >
        📱 Mobile version isn't working yet... <br />
        <br />
        👋 Come back on a computer.
      </div>
    </MobileView>
  );
};

export default MobileCheck;
