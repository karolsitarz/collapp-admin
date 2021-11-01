import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import React, { useState } from 'react'
import Modal from 'shared/components/Modal'
import Button from 'shared/components/button/Button'
import ErrorPage from 'includes/components/ErrorPage'
import LoadingSessionLayout from 'includes/components/LoadingSession'
import NavigationPanel from 'includes/components/NavigationPanel'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import download from 'downloadjs'
import { amazonUrl } from 'shared/utils/awsHelpers'
import { MdOutlineArrowBackIosNew } from 'react-icons/md'
import {
  BsPersonCircle,
  BsFillCloudDownloadFill,
  BsFillQuestionSquareFill,
} from 'react-icons/bs'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query
  const res = await fetch(`${process.env.BASE_URL}/api/plugins/${id}`, {
    method: 'GET',
    headers: {
      ...(context?.req?.headers?.cookie && {
        cookie: context.req.headers.cookie,
      }),
    },
  })

  const isError = !res.ok

  if (isError) {
    return { props: { error: await res.json(), isError } }
  }

  return {
    props: {
      plugin: await res.json(),
      isError: !res.ok,
    },
  }
}

const Plugin = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  if (props.isError) {
    return (
      <LoadingSessionLayout>
        <ErrorPage {...props.error} />
      </LoadingSessionLayout>
    )
  }

  const router = useRouter()
  const { icon, name, description, createdAt, source, authorId, isPending } =
    props.plugin
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <Head>
        <title>Plugin</title>
      </Head>
      <NavigationPanel>
        <Button
          color="light"
          onClick={() => router.back()}
          className="mr-auto mt-3 ml-3 border-2 border-gray-400"
        >
          <MdOutlineArrowBackIosNew className="mr-2 -ml-2" />
          Back
        </Button>
        <div className="m-auto">
          <div className="bg-gray-50 shadow-2xl py-8 px-16 rounded-2xl mb-4">
            <div className="flex items-center">
              <img
                src={icon || '/collapp.svg'}
                className="w-40 h-40 rounded-2xl"
              />
              <div className="flex flex-col ml-8">
                <h1 className="text-4xl font-bold">{name}</h1>
                <p className="mt-4">{dayjs(createdAt).format('LLL')}</p>
              </div>
            </div>
            <p className="text-center italic p-2 my-12 rounded-lg bg-gray-100 border-2">
              "{!!description ? description : '-'}"
            </p>
            <div className="m-auto">
              <div className="flex items-center justify-center space-x-4 my-3">
                <p>Author:</p>
                <Button
                  onClick={() => router.push(`/panel/developers/${authorId}`)}
                >
                  <BsPersonCircle className="mr-2 -ml-2" />
                  Developer
                </Button>
              </div>
              {!!source && (
                <div className="flex items-center justify-center space-x-4 my-3">
                  <p>Source:</p>
                  <Button onClick={() => download(amazonUrl + source.url)}>
                    <BsFillCloudDownloadFill className="mr-2 -ml-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
            {isPending && (
              <div className="mt-8">
                <hr className="border-gray-300" />
                <Button
                  className="mx-auto mt-4"
                  color="red"
                  onClick={() => setVisible(true)}
                >
                  <BsFillQuestionSquareFill className="mr-2 -ml-2" />
                  Decide
                </Button>
                <Modal visible={visible} close={() => setVisible(false)}>
                  WIP
                </Modal>
              </div>
            )}
          </div>
        </div>
      </NavigationPanel>
    </div>
  )
}

export default Plugin
