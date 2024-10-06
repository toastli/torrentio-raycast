import { List, ActionPanel, Action, getPreferenceValues } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { StreamView, MediaGrid, Stream, Preferences, fetchJSON } from "./shared";

interface TVSeries {
  id: string;
  name: string;
  poster: string;
  releaseinfo: string;
}

interface Episode {
  id: string;
  name: string;
  overview: string;
  season: number;
  episode: number;
  released: string;
}

function EpisodeView({
  series,
  episodes,
  isLoading,
  onSelectEpisode,
  onBack,
  setSearchText,
}: {
  series: TVSeries;
  episodes: Episode[];
  isLoading: boolean;
  onSelectEpisode: (episode: Episode) => void;
  onBack: () => void;
  setSearchText: (text: string) => void;
}) {
  const groupedEpisodes = episodes.reduce(
    (acc, episode) => {
      if (episode.season !== 0) {
        if (!acc[episode.season]) {
          acc[episode.season] = [];
        }
        acc[episode.season].push(episode);
      }
      return acc;
    },
    {} as Record<number, Episode[]>,
  );

  // Sort episodes within each season
  Object.keys(groupedEpisodes).forEach((season) => {
    groupedEpisodes[Number(season)].sort((a, b) => a.episode - b.episode);
  });

  // Sort seasons
  const sortedSeasons = Object.keys(groupedEpisodes).sort((a, b) => Number(a) - Number(b));
  const sortedGroupedEpisodes: Record<number, Episode[]> = {};
  sortedSeasons.forEach((season) => {
    sortedGroupedEpisodes[Number(season)] = groupedEpisodes[Number(season)];
  });

  return (
    <List isLoading={isLoading} navigationTitle={series.name}>
      {Object.entries(groupedEpisodes).map(([season, eps]) => (
        <List.Section key={season} title={`Season ${season}`}>
          {eps.map((episode) => (
            <List.Item
              key={episode.id}
              title={`S${episode.season}E${episode.episode}: ${episode.name}`}
              subtitle={episode.overview}
              actions={
                <ActionPanel>
                  <Action
                    title="Select Episode"
                    onAction={() => {
                      setSearchText(""); // Reset search text when selecting an episode
                      onSelectEpisode(episode);
                    }}
                  />
                  <Action title="Go Back" onAction={onBack} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

export default function Command() {
  const [isLoading, setLoading] = useState(false);
  const [series, setSeries] = useState<TVSeries[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<TVSeries | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const preferences = getPreferenceValues<Preferences>();
  const [searchText, setSearchText] = useState("");

  const getStreams = useCallback(
    async (id: string) => {
      console.log(
        `https://torrentio.strem.fun/${preferences.debridProvider}=${preferences.apiKey}/stream/series/${id}.json`,
      );
      setLoading(true);
      try {
        const data = await fetchJSON<{ streams?: Stream[] }>(
          `https://torrentio.strem.fun/${preferences.debridProvider}=${preferences.apiKey}/stream/series/${id}.json`,
        );
        setStreams(
          data.streams?.map((stream) => ({
            name: stream.name,
            title: stream.title,
            url: stream.url,
          })) || [],
        );
      } catch (error) {
        console.error("Error fetching streams:", error);
      } finally {
        setLoading(false);
      }
    },
    [preferences.debridProvider, preferences.apiKey],
  );

  const getEpisodes = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchJSON<{ meta?: { videos?: Episode[] } }>(
        `https://v3-cinemeta.strem.io/meta/series/${id}.json`,
      );
      if (data.meta?.videos) {
        setEpisodes(data.meta.videos);
      }
    } catch (error) {
      console.error("Error fetching episodes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSeries = useCallback(async (text: string) => {
    if (!text) {
      setSeries([]);
      return;
    }
    setLoading(true);
    try {
      const encodedSearch = encodeURIComponent(text);
      const data = await fetchJSON<{ metas?: TVSeries[] }>(
        `https://v3-cinemeta.strem.io/catalog/series/top/search=${encodedSearch}.json`,
      );
      setSeries(
        data.metas?.map((s) => ({
          id: s.id,
          name: s.name,
          poster: s.poster,
          releaseinfo: s.releaseinfo,
        })) || [],
      );
    } catch (error) {
      console.error("Error fetching TV series:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchSeries = useCallback(
    debounce((text: string) => {
      getSeries(text);
    }, 200),
    [getSeries],
  );

  useEffect(() => {
    if (selectedSeries) {
      getEpisodes(selectedSeries.id);
    }
  }, [selectedSeries, getEpisodes]);

  useEffect(() => {
    if (selectedEpisode) {
      getStreams(selectedEpisode.id);
    }
  }, [selectedEpisode, getStreams]);

  if (selectedEpisode) {
    return (
      <StreamView
        streams={streams}
        isLoading={isLoading}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onBack={() => {
          setSelectedEpisode(null);
          setStreams([]);
          setSearchText(""); // Reset search text when going back
        }}
      />
    );
  }

  if (selectedSeries) {
    return (
      <EpisodeView
        series={selectedSeries}
        episodes={episodes}
        isLoading={isLoading}
        onSelectEpisode={setSelectedEpisode}
        setSearchText={setSearchText}
        onBack={() => {
          setSelectedSeries(null);
          setEpisodes([]);
        }}
      />
    );
  }

  return (
    <MediaGrid
      items={series}
      isLoading={isLoading}
      onSearchTextChange={debouncedFetchSeries}
      onSelectItem={setSelectedSeries}
      navigationTitle="Search TV Series"
      searchBarPlaceholder="Search for a TV series"
    />
  );
}
