export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="p-10 border-t bg-[rgb(27,27,27)] text-white">
      <p className="text-sm text-white">
        © Copyright {year}, IIT Indore. All rights reserved.
      </p>
    </footer>
  );
}
