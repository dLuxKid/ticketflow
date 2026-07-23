import { useRouter } from "next/navigation";

export default function ErrorPage({ error }: { error: any }) {
  const router = useRouter();

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-center">
        {error?.response
          ? error.response.data.message
          : "Something went wrong!"}
      </h2>
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="231"
          height="231"
          viewBox="0 0 231 231"
          fill="none"
        >
          <circle cx="115.5" cy="115.5" r="115.5" fill="#E5E5E6" />
          <path
            d="M87.4054 81.1622H91.5675V72.8379H99.8919V81.1622H133.189V72.8379H141.513V81.1622H145.676C150.296 81.1622 154 84.8665 154 89.4865V147.757C154 149.965 153.123 152.082 151.562 153.643C150.001 155.204 147.883 156.081 145.676 156.081H87.4054C85.1976 156.081 83.0803 155.204 81.5192 153.643C79.9581 152.082 79.0811 149.965 79.0811 147.757V89.4865C79.0811 87.2788 79.9581 85.1615 81.5192 83.6004C83.0803 82.0392 85.1976 81.1622 87.4054 81.1622ZM87.4054 147.757H145.676V106.135H87.4054V147.757ZM87.4054 97.8109H145.676V89.4865H87.4054V97.8109ZM137.351 114.46V139.432H129.027V114.46H137.351Z"
            fill="#1F1F1F"
            fillOpacity="0.4"
          />
        </svg>
      </div>
      <div className="flex-center gap-4">
        <button
          className="mt-4 rounded-sm bg-main-purple px-6 py-3 text-sm font-medium text-white"
          onClick={() => router.back()}
        >
          Go back
        </button>

        <button
          className="mt-4 rounded-sm bg-main-purple px-6 py-3 text-sm font-medium text-white"
          onClick={() => router.refresh()}
        >
          Refresh Page
        </button>
      </div>
    </main>
  );
}
