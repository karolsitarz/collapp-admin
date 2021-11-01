import { useFilters } from 'shared/hooks/useFilters'
import useSWR from 'swr'
import { generateKey } from 'shared/utils/object'

export const useQuery = (key: string[] | string | false, path: string) => {
  const [filters] = useFilters()
  const filteredSearch = Object.entries(filters).reduce(
    (acc, [key, value]) => (value == null ? acc : { ...acc, [key]: value }),
    {},
  )
  const search = new URLSearchParams(filteredSearch)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return useSWR(key ? generateKey(key, filters) : null, () =>
    fetch(`${origin}${path}?` + search).then((res) => res.json()),
  )
}