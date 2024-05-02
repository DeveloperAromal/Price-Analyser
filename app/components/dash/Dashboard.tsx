"use client";
import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "react-toastify";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { ScaleLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

const supabase = createClientComponentClient();

const Account = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("hasLoggedIn");
    router.push("/auth/v1/login");
    toast.success("SignOut successfully");
  };

  return (
    <div className="w-40 h-14 bg-white rounded-md absolute right-2 z-20">
      <div>
        <button className="flex gap-2 px-4 py-3" onClick={handleLogout}>
          <Image
            src="/icons/signout.png"
            alt="signout"
            width={30}
            height={30}
          />
          <h3 className="text-black text-xl">SignOut</h3>
        </button>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const router = useRouter(); // Move useRouter here

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    title: string;
    price: string | null;
    image: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedProducts, setAddedProducts] = useState<
    Array<{
      title: string;
      price: string | null;
      image: string | null;
    }>
  >([]);
  const [showSignOut, setShowSignOut] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userEmail = session.user.email || null;
        setEmail(userEmail);
        // Fetch user's history from the database
        fetchUserHistory(userEmail);
      } else {
        setEmail(null);
      }
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  const fetchUserHistory = async (email: string | null) => {
    if (email) {
      try {
        const { data, error }: PostgrestSingleResponse<any[]> = await supabase
          .from("Pricehawk_Database")
          .select("*")
          .eq("email", email);

        if (error) {
          throw error;
        }

        if (data) {
          setAddedProducts(data);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        console.error("Error fetching user history:", errorMessage);
      }
    }
  };

 // In Dashboard component
const handleShowMore = () => {
  router.push(`/test?addedProducts=${encodeURIComponent(JSON.stringify(addedProducts))}`);
};


  const fetchData = async () => {
    if (url) {
      setLoading(true);
      try {
        const response = await axios.post("/api/scrape", { url });

        const newData = {
          title: response.data.title,
          price: response.data.price,
          image: response.data.image,
          url: url,
          email: email,
        };

        const { data: insertedData, error } = await supabase
          .from("Pricehawk_Database")
          .insert([newData]);

        if (error) {
          throw error;
        }

        setData(newData);
        setError(null);
        setAddedProducts([...addedProducts, newData]);
      } catch (error: any) {
        setError(
          `Error fetching data: ${
            (error.response?.data.message || error.message) as string
          }`
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please enter a URL.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchData();
  };

  const toggleSignOut = () => {
    setShowSignOut(!showSignOut);
  };

  return (
    <section>
      <div className="px-4 md:px-8 lg:px-4 xl:px-4">
        <div className="flex items-end justify-end pt-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center">
            <h1 className="absolute right-2 flex gap-2">
              <Link href="#">
                <Image
                  src="/icons/bell.png"
                  alt="bell"
                  width={30}
                  height={30}
                />
              </Link>
              <Link href="#">
                <Image
                  src="/icons/settings.png"
                  alt="settings"
                  width={30}
                  height={30}
                />
              </Link>
              <div>
                {showSignOut && <Account />}
                {!showSignOut && (
                  <Image
                    src="/icons/account.png"
                    alt="account"
                    width={30}
                    height={30}
                    onClick={toggleSignOut}
                  />
                )}
              </div>
            </h1>
          </div>
        </div>
        <div>
          <h1 className="text-center font-bold text-4xl md:text-5xl lg:text-6xl pt-10">
            Paste the link
          </h1>
          <p
            className="text-center text-2xl md:text-3xl lg:text-5xl pt-4"
            style={{ fontFamily: "Dancing Script" }}
          >
            and see the magic
          </p>
        </div>
        <div className="flex items-center justify-center py-10">
          <form className="w-full md:w-auto" onSubmit={handleSubmit}>
            <div className="flex">
              <input
                type="text"
                placeholder="Enter a new product url to track...."
                className="w-full md:w-96 h-12 rounded-tl-md rounded-bl-md pl-2 border-2 text-neutral-300 bg-transparent border-white"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <div>
                <button
                  type="submit"
                  className="px-8 py-3 bg-white rounded-tr-md rounded-br-md text-black text-md font-bold"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>
        {loading && ( // Show loading indicator when loading is true
          <div className="flex justify-center py-4">
            <ScaleLoader color="cyan" />
          </div>
        )}
        {error && <p className="text-center text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-10 pt-10">
          {addedProducts.slice(0, 3).map((data, index) => (
            <div key={index} className="flex  py-2">
              <div>
                {data.image && (
                  <div className="flex items-center justify-center">
                    <div className="w-64 h-64">
                      <Image
                        src={data.image}
                        alt="Product"
                        width={150}
                        height={150}
                        className="w-full h-full rounded-md shad"
                      />
                    </div>
                  </div>
                )}
                <div className="text-black text-center pt-4">
                  <p className="text-cust text-justify max-w-72 text-neutral-300">
                    {data.title}
                  </p>
                  {data.price && (
                    <p className="text-lg font-bold text-neutral-300">
                      <span className="text-teal-500">Price:</span> {data.price}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {addedProducts.length > 3 && (
          <div className="flex justify-center py-4">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleShowMore}
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
