import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import React from 'react'
import PluginsList from 'includes/components/PluginsList'
import NavigationPanel from 'includes/components/NavigationPanel'
import { LogoSpinner } from 'shared/components/LogoSpinner'
import { Pagination } from 'shared/components/Pagination'
import { useFilters, withFilters } from 'shared/hooks/useFilters'
import { generateKey, objectPick } from 'shared/utils/object'
import ErrorPage from 'includes/components/ErrorPage'
import { useQuery } from 'shared/hooks/useQuery'
import { object, string } from 'yup'
import { InputText } from 'shared/components/input/InputText'
import { FiltersForm } from 'shared/components/form/FiltersForm'
import { AiOutlineSearch } from 'react-icons/ai'
import LoadingSessionLayout from 'includes/components/LoadingSession'
import Head from 'next/head'
import { InputSelect } from 'shared/components/input/InputSelect'

const filtersSchema = object().shape({
  name: string().default(''),
  status: string().nullable(),
})

const PluginStatus = [
  {
    label: 'Private',
    value: 'Private',
  },
  {
    label: 'Pending',
    value: 'Pending',
  },
  {
    label: 'Updating',
    value: 'Updating',
  },
]

export const getServerSideProps: GetServerSideProps = async (context) => {
  const params = objectPick(context.query, ['limit', 'page', 'name'])
  const search = new URLSearchParams(params)

  const res = await fetch(`${process.env.BASE_URL}/api/plugins?${search}`, {
    method: 'GET',
    headers: {
      ...(context?.req?.headers?.cookie && {
        cookie: context.req.headers.cookie,
      }),
    },
  })

  if (!res.ok) {
    return {
      props: {
        error: await res.json(),
        isError: true,
      },
    }
  }

  return {
    props: {
      fallback: {
        [generateKey('plugins', params)]: await res.json(),
      },
    },
  }
}

function Plugins(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const [, setFilters] = useFilters()
  const { data } = useQuery('plugins', '/api/plugins')

  if (props.isError) {
    return (
      <LoadingSessionLayout>
        <ErrorPage {...props.error} />
      </LoadingSessionLayout>
    )
  }

  return (
    <div>
      <Head>
        <title>Plugins</title>
      </Head>
      <NavigationPanel>
        <div className="bg-white p-6 rounded-3xl shadow-xl mb-4">
          <FiltersForm schema={filtersSchema}>
            <div className="flex flex-col md:flex-row">
              <InputSelect
                label="Status"
                name="status"
                options={PluginStatus}
                className="w-full md:w-64 mr-2 mb-2 md:mb-0"
              />
              <InputText
                icon={AiOutlineSearch}
                name="name"
                label="Plugin name"
                className="flex-grow"
              />
            </div>
          </FiltersForm>
        </div>

        {!data && (
          <div className="m-auto p-12">
            <LogoSpinner />
          </div>
        )}
        {!!data && !data.entities?.length && (
          <div className="bg-white p-20 rounded-3xl shadow-2xl text-gray-600 text-center text-lg m-auto">
            No plugins found
          </div>
        )}
        {!!data && !!data.entities?.length && (
          <div className="my-auto">
            <div className="bg-white px-8 py-4 rounded-3xl shadow-2xl overflow-x-auto">
              <PluginsList plugins={data?.entities} />
            </div>
            <div className="mb-6">
              <Pagination
                page={data?.pagination.page}
                pages={data?.pagination.pages}
                setPage={(page) => setFilters({ page: String(page) })}
              />
            </div>
          </div>
        )}
      </NavigationPanel>
    </div>
  )
}

export default withFilters(Plugins, ['limit', 'page', 'name', 'status'])
