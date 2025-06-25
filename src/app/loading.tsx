import { ThreeDot } from "react-loading-indicators";
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="mb-4">
        <ThreeDot
          variant="bounce"
          color="#3163cc"
          size="large"
          text=""
          textColor="#0200ff"
        />
      </div>
      Loading...
    </div>
  );
}
