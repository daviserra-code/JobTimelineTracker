import { Link, useLocation } from "wouter";

export default function MobileNav() {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t shadow-lg z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center p-3 w-1/4 ${location === "/" ? "text-primary" : "text-gray-600"}`}>
            <span className="material-icons">today</span>
            <span className="text-xs mt-1">Calendar</span>
          </a>
        </Link>
        <Link href="/notifications">
          <a className={`flex flex-col items-center p-3 w-1/4 ${location === "/notifications" ? "text-primary" : "text-gray-600"}`}>
            <span className="material-icons">notifications</span>
            <span className="text-xs mt-1">Alerts</span>
          </a>
        </Link>
        <Link href="/import">
          <a className={`flex flex-col items-center p-3 w-1/4 ${location === "/import" ? "text-primary" : "text-gray-600"}`}>
            <span className="material-icons">download</span>
            <span className="text-xs mt-1">Import</span>
          </a>
        </Link>
        <Link href="/settings">
          <a className={`flex flex-col items-center p-3 w-1/4 ${location === "/settings" ? "text-primary" : "text-gray-600"}`}>
            <span className="material-icons">settings</span>
            <span className="text-xs mt-1">Settings</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
