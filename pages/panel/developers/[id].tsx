import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React from 'react'
import PluginsList from 'components/PluginsList'
import ErrorPage from 'components/ErrorPage'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query
  const developerRes = await fetch(
    `${process.env.BASE_URL}/api/developers/${id}`,
    {
      method: 'GET',
      headers: {
        ...(context?.req?.headers?.cookie && {
          cookie: context.req.headers.cookie,
        }),
      },
    },
  )

  let isError = !developerRes.ok

  if (isError) {
    return { props: { error: await developerRes.json(), isError } }
  }

  const pluginsRes = await fetch(
    `${process.env.BASE_URL}/api/developers/${id}/plugins`,
    {
      method: 'GET',
      headers: {
        ...(context?.req?.headers?.cookie && {
          cookie: context.req.headers.cookie,
        }),
      },
    },
  )

  isError = !pluginsRes.ok
  if (isError) {
    return { props: { error: await pluginsRes.json(), isError } }
  }

  const { plugins, pagination } = await pluginsRes.json()

  return {
    props: {
      developer: await developerRes.json(),
      plugins,
      pagination,
      isError,
    },
  }
}

const Developer = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  if (props.isError) {
    return <ErrorPage {...props.error}></ErrorPage>
  }

  const { image, name, email } = props.developer

  return (
    <>
      <div>
        <Link href="./">
          <button>Developer list</button>
        </Link>
      </div>
      <div>
        <img src={image} alt="" />
        <h1>{name}</h1>
        <p>{email}</p>
        <hr />
        {props.plugins.length ? (
          <PluginsList plugins={props.plugins}></PluginsList>
        ) : (
          <p>Developers hasn't created any plugins yet</p>
        )}
      </div>
    </>
  )
}

export default Developer