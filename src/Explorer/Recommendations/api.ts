import { JunoClient } from "../../Juno/JunoClient";

export const getRecommendations(endpoint: string): string {
    let url = `${endpoint}/api/notebooks/recos`;
    const response = await window.fetch(url, {
        method: "GET",
        headers: JunoClient.getHeaders()
      });
  
 }