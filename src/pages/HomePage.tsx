"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import PlatformFeeDrawer from "@/components/drawer/PlatformFeeDrawer";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProvider } from "@/services/blockchain";
import { toast } from "sonner";
import { isOwner } from "@/services/owner/ContractOwnerService";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const HomePage = () => {
  const [globeWidth, setGlobeWidth] = useState(0);
  const [globeHeight, setGlobeHeight] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOwnerWallet, setIsOwnerWallet] = useState<boolean>(false);

  // Globe configuration
  const N = 20;
  const arcsData = [...Array(N).keys()].map(() => ({
    startLat: (Math.random() - 0.5) * 180,
    startLng: (Math.random() - 0.5) * 360,
    endLat: (Math.random() - 0.5) * 180,
    endLng: (Math.random() - 0.5) * 360,
    color: [
      ["#2563eb", "#3b82f6", "#6366f1"][Math.round(Math.random() * 2)],
      ["#9333ea", "#c026d3", "#db2777"][Math.round(Math.random() * 2)],
    ],
  }));

  // Feature cards data
  const features = [
    {
      title: "Blockchain Transparency",
      description:
        "Every transaction and movement recorded immutably on the high-performance Solana blockchain.",
    },
    {
      title: "Real-Time Tracking",
      description:
        "Monitor shipments with live data feeds and potential IoT sensor integration, secured by Solana.",
    },
    {
      title: "Smart Contracts",
      description:
        "Automate payments, agreements, and compliance checks using efficient Solana smart contracts.",
    },
  ];

  // Stats data
  const stats = [
    { value: "1M+", label: "Transactions Processed Daily" },
    { value: "~400ms", label: "Average Block Time" },
    { value: "<$0.00025", label: "Avg. Transaction Fee" },
  ];
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  const program = useMemo(() => {
    if (publicKey && signTransaction && sendTransaction) {
      try {
        return getProvider(publicKey, signTransaction, sendTransaction);
      } catch (error) {
        console.error("Error getting provider:", error);
        toast.error("Failed to initialize blockchain connection.");
        return null;
      }
    }
    return null;
  }, [publicKey, signTransaction, sendTransaction]);
  const isCurrentUserOwner = async () => {
    if (!publicKey || !program) return;
    const o = await isOwner(program, publicKey);
    setIsOwnerWallet(o);
  };
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setGlobeWidth(containerRef.current.offsetWidth);
        setGlobeHeight(containerRef.current.offsetHeight);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    isCurrentUserOwner();
    return () => window.removeEventListener("resize", updateSize);
  }, [program, publicKey]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div
      ref={containerRef}
      className={
        "relative min-h-screen overflow-hidden pt-24 " +
        "bg-gradient-to-br from-white via-blue-50 to-purple-50 " +
        "dark:from-gray-950 dark:via-slate-900 dark:to-purple-950 " +
        "text-slate-900 dark:text-slate-100"
      }
    >
      {/* Animated Globe */}
      {globeWidth > 0 && globeHeight > 0 && (
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30">
          <Globe
            width={globeWidth}
            height={globeHeight}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
            arcsData={arcsData}
            arcColor={"color"}
            arcDashLength={() => Math.random()}
            arcDashGap={() => Math.random()}
            arcDashAnimateTime={() => Math.random() * 4000 + 1000}
            arcStroke={0.3}
            atmosphereColor={"#6366F1"}
            atmosphereAltitude={0.2}
          />
        </div>
      )}

      <motion.main
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Hero Section */}
          <motion.h1
            className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-8"
            variants={itemVariants}
          >
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-2">
              Supply Chain
            </span>
            <span className="block text-slate-700 dark:text-slate-300 text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2">
              Powered by Solana
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-slate-700 dark:text-slate-400 mb-12 max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Revolutionize your supply chain management with blockchain-powered
            transparency, real-time tracking, and immutable audit trails, built
            on the speed and efficiency of Solana.
          </motion.p>

          <motion.div
            className="flex justify-center gap-6 mb-24"
            variants={itemVariants}
          >
            <Link href="/profile" legacyBehavior>
              <a
                className={
                  "inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white transition duration-300 ease-in-out transform " +
                  "bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-full shadow-lg " +
                  "hover:scale-105 hover:shadow-blue-500/40 " +
                  "dark:hover:shadow-purple-500/60 " +
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 " +
                  "focus:ring-offset-white dark:focus:ring-offset-gray-950"
                }
              >
                Get Started
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </Link>
            {isOwnerWallet && (
              <Button onClick={() => setIsDrawerOpen(true)}>
                Update Platform Fee
              </Button>
            )}
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card
                className={
                  "transition-all duration-300 ease-in-out rounded-xl overflow-hidden backdrop-blur-lg " +
                  "bg-white/90 border border-slate-100 shadow-xl hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 " +
                  "dark:bg-slate-800/60 dark:border-slate-700/80 dark:hover:border-indigo-500/80"
                }
              >
                <CardHeader className="p-6">
                  <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-slate-700 dark:text-slate-400 text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className={
            "mt-24 w-full max-w-5xl rounded-3xl p-8 backdrop-blur-lg " +
            "bg-white/90 border border-slate-100 shadow-2xl " +
            "dark:bg-slate-800/60 dark:border-slate-700/80"
          }
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">
            {stats.map((stat, index) => (
              <div key={index} className="text-center px-4 py-6 sm:py-0">
                <div className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.main>

      <PlatformFeeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};

export default HomePage;
