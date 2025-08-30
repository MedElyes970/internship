"use client";

import { useState, useEffect } from "react";

const TrustedBy = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("trusted-by-section");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const companies = [
    { name: "Company A", logo: "/placeholder-logo-1.png" },
    { name: "Company B", logo: "/placeholder-logo-2.png" },
    { name: "Company C", logo: "/placeholder-logo-3.png" },
    { name: "Company D", logo: "/placeholder-logo-4.png" },
    { name: "Company E", logo: "/placeholder-logo-5.png" },
    { name: "Company F", logo: "/placeholder-logo-6.png" },
  ];

  return (
    <section id="trusted-by-section" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Trusted By Leading Companies
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their business needs
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {companies.map((company, index) => (
            <div
              key={company.name}
              className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {/* Placeholder logo - replace with actual logos later */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-3 border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-gray-400 text-xs font-medium">
                    {company.name}
                  </div>
                  <div className="text-gray-300 text-xs">LOGO</div>
                </div>
              </div>
              
              {/* Company name */}
              <div className="text-sm text-gray-600 font-medium text-center">
                {company.name}
              </div>
            </div>
          ))}
        </div>

        {/* Additional trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm">ISO Certified</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-sm">24/7 Support</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <span className="text-sm">Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
