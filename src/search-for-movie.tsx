import { getPreferenceValues } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { StreamView, MediaGrid, Stream, Preferences, fetchJSON } from "./shared";

interface Movie {
  id: string;
  name: string;
  poster: string;
  releaseinfo: string;
}

export default function Command() {
  const [isLoading, setLoading] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const preferences = getPreferenceValues<Preferences>();

  const getStreams = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const data = await fetchJSON<{ streams?: Stream[] }>(
          `https://torrentio.strem.fun/${preferences.debridProvider}=${preferences.apiKey}/stream/movie/${id}.json`,
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

  useEffect(() => {
    if (selectedMovie) {
      getStreams(selectedMovie.id);
    }
  }, [selectedMovie, getStreams]);

  const getMovies = useCallback(async (text: string) => {
    if (!text) {
      setMovies([]);
      return;
    }
    setLoading(true);
    try {
      const encodedSearch = encodeURIComponent(text);
      const data = await fetchJSON<{ metas?: Movie[] }>(
        `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodedSearch}.json`,
      );
      setMovies(
        data.metas?.map((movie) => ({
          id: movie.id,
          name: movie.name,
          poster: movie.poster,
          releaseinfo: movie.releaseinfo,
        })) || [],
      );
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchMovies = useCallback(
    debounce((text: string) => {
      getMovies(text);
    }, 200),
    [getMovies],
  );

  if (selectedMovie) {
    return (
      <StreamView
        streams={streams}
        isLoading={isLoading}
        preferences={preferences}
        onBack={() => {
          setSelectedMovie(null);
          setStreams([]);
        }}
      />
    );
  }

  return (
    <MediaGrid
      items={movies}
      isLoading={isLoading}
      onSearchTextChange={debouncedFetchMovies}
      onSelectItem={setSelectedMovie}
      navigationTitle="Search Movies"
      searchBarPlaceholder="Search for a movie"
    />
  );
}
