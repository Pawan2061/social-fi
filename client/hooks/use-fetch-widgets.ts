import { useQuery } from "@tanstack/react-query";

export async function fetchWidgets() {
    const token = localStorage.getItem("authToken");

    if (!token) {
        throw new Error("No authentication token found");
    }

    const res = await fetch("http://localhost:4000/api/widgets", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch widgets: ${res.statusText}`);
    }

    return res.json();
}

type UseFetchWidgetsOptions = {
    enabled?: boolean;
};

export const useFetchWidgets = (opts?: UseFetchWidgetsOptions) => {
    return useQuery({
        queryKey: ["widgets"],
        queryFn: fetchWidgets,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        retry: 1, // retry once on failure
        enabled: opts?.enabled ?? true,
    });
}