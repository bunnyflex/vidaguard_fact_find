export default function AppFooter() {
  return (
    <footer className="border-t bg-white py-6 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} InsureAI. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-sm text-gray-500 hover:text-primary">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary">Terms of Service</a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
