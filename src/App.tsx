import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Outlet, ScrollRestoration } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import SlowLifeApp from "@/pages/mobile/SlowLifeApp";
import ScrollToHashElement from "@/components/ScrollToHashElement";

const queryClient = new QueryClient();
function RootLayout() { return <><Outlet/><ScrollRestoration/><ScrollToHashElement/></>; }
const router = createBrowserRouter(createRoutesFromElements(<Route element={<RootLayout/>}><Route path="*" element={<SlowLifeApp/>}/></Route>));
const App = () => <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange><QueryClientProvider client={queryClient}><TooltipProvider><Sonner position="bottom-center"/><RouterProvider router={router}/></TooltipProvider></QueryClientProvider></ThemeProvider>;
export default App;
