import { Grid, List, ActionPanel, Action, closeMainWindow, Icon } from "@raycast/api";
import { exec } from "child_process";
import fetch from "node-fetch";
import { useEffect } from "react";

export interface Stream {
  name: string;
  title: string;
  url: string;
}

export interface Preferences {
  debridProvider: string;
  apiKey?: string;
  command: string;
}

export function StreamView({
  streams,
  isLoading,
  onBack,
  preferences,
}: {
  streams: Stream[];
  isLoading: boolean;
  onBack: () => void;
  preferences: Preferences;
}) {
  const openInApplication = (url: string) => {
    exec(preferences.command.replace("{}", url), (error) => {
      if (error) {
        console.error("Error opening Application:", error);
      }
      closeMainWindow();
    });
  };

  return (
    <List isLoading={isLoading} isShowingDetail={false}>
      {streams.map((stream, index) => (
        <List.Item
          key={index}
          accessories={[
            {
              icon: {
                source: stream.name.toLowerCase().includes("download") ? Icon.FullSignal : Icon.HardDrive,
                tintColor: stream.name.toLowerCase().includes("download")
                  ? { dark: "#FF0000", light: "#FF0000" }
                  : { dark: "#00FF00", light: "#00FF00" },
              },
            },
          ]}
          title={
            stream.title.split("\n").findIndex((s) => s.includes("👤") && s.includes("💾") && s.includes("⚙️")) !== -1
              ? stream.title
                  .split("\n")
                  .slice(
                    stream.title.split("\n").findIndex((s) => s.includes("👤") && s.includes("💾") && s.includes("⚙️")),
                  )
                  .join(" ")
              : "No Stream Info.."
          }
          subtitle={stream.title.split("\n")[0]}
          actions={
            <ActionPanel>
              <Action title="Open in App" onAction={() => openInApplication(stream.url)} />
              <Action title="Go Back" onAction={onBack} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

export function MediaGrid<T extends { id: string; name: string; poster: string }>({
  items,
  isLoading,
  onSearchTextChange,
  onSelectItem,
  navigationTitle,
  searchBarPlaceholder,
}: {
  items: T[];
  isLoading: boolean;
  onSearchTextChange: (text: string) => void;
  onSelectItem: (item: T) => void;
  navigationTitle: string;
  searchBarPlaceholder: string;
}) {
  useEffect(() => {
    onSearchTextChange(""); // Fetch the trending movies/tv on initialization
  }, []);
  return (
    <Grid
      columns={5}
      inset={Grid.Inset.Zero} // Idk why this doesnt work
      navigationTitle={navigationTitle}
      searchBarPlaceholder={searchBarPlaceholder}
      isLoading={isLoading}
      onSearchTextChange={onSearchTextChange}
      aspectRatio="2/3"
    >
      {items.map((item) => (
        <Grid.Item
          title={item.name}
          content={item.poster}
          key={item.id}
          actions={
            <ActionPanel>
              <Action title="Show Details" onAction={() => onSelectItem(item)} />
              <Action.OpenInBrowser title="Open on IMDB" url={`https://imdb.com/title/${item.id}`} />
            </ActionPanel>
          }
        />
      ))}
    </Grid>
  );
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json() as Promise<T>;
}
