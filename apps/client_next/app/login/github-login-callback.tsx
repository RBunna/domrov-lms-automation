"use client";
import { useEffect, useState } from "react";

export default function GitHubLoginCallback() {
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
	const [message, setMessage] = useState<string>("");

	useEffect(() => {
		const url = new URL(window.location.href);
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");
		const storedState = sessionStorage.getItem("oauth_state");

		if (!code || !state || state !== storedState) {
			setStatus("error");
			setMessage("Invalid or missing OAuth code/state.");
			window.opener?.postMessage({ type: "OAUTH_ERROR", payload: { message: "Invalid or missing OAuth code/state." } }, window.origin);
			return;
		}

		fetch("/api/auth/github/callback", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code, state }),
		})
			.then(async (res) => {
				if (!res.ok) throw new Error(await res.text());
				return res.json();
			})
			.then((data) => {
				if (data.accessToken && data.user) {
					setStatus("success");
					setMessage("GitHub login successful!");
					window.opener?.postMessage({ type: "OAUTH_SUCCESS", payload: data }, window.origin);
					setTimeout(() => window.close(), 1000);
				} else {
					throw new Error("Invalid response from server.");
				}
			})
			.catch((err) => {
				setStatus("error");
				setMessage(err.message || "Authentication failed.");
				window.opener?.postMessage({ type: "OAUTH_ERROR", payload: { message: err.message } }, window.origin);
			});
	}, []);

	return (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
			{status === "loading" && <div>Connecting to GitHub...</div>}
			{status === "success" && <div style={{ color: "green" }}>{message}</div>}
			{status === "error" && <div style={{ color: "red" }}>{message}</div>}
		</div>
	);
}