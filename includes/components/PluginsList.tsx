import React from 'react'
import { DraftPlugin } from '@prisma/client'
import Link from 'next/link'
import classNames from 'classnames'
import dayjs from 'dayjs'
import {
  buildingColor,
  pendingColor,
  privateColor,
} from 'includes/utils/statusColors'
import { truncate } from 'shared/utils/text'
import { Tooltip } from 'shared/components/Tooltip'

const PluginsList = ({
  plugins,
  isCompact = false,
}: {
  plugins: DraftPlugin[]
  isCompact?: boolean
}) => {
  const { padding, imgSize } = isCompact
    ? { padding: 'p-3', imgSize: 'w-6 h-6 rounded-25' }
    : { padding: 'p-4', imgSize: 'w-8 h-8 rounded-25' }

  return (
    <table className="flex-1 w-full">
      <thead>
        <tr>
          <th className={classNames(padding, 'text-left')}>Name</th>
          <th className={classNames(padding, 'text-left')}>Description</th>
          <th className={classNames(padding, 'text-left')}>Date</th>
          <th className={classNames(padding, 'text-left')}>Status</th>
        </tr>
      </thead>
      <tbody>
        {plugins.map((plugin: DraftPlugin) => (
          <Link key={plugin.id} href={`/panel/plugins/${plugin.id}`} passHref>
            <tr style={{ cursor: 'pointer' }} className="hover:bg-gray-200">
              <td className={classNames(padding, 'flex items-center')}>
                <img
                  src={plugin.icon || '/collapp.svg'}
                  className={classNames(
                    imgSize,
                    'shadow-lg mr-3 bg-gray-150 rounded-25 bg-white',
                  )}
                  alt="Plugin icon"
                />
                {truncate(plugin.name, 50)}
              </td>

              <td className={padding}>
                {truncate(plugin.description, isCompact ? 50 : 100)}
              </td>
              <td className={classNames(padding, 'text-sm break-normal')}>
                {dayjs(plugin.createdAt).format('LLL')}
              </td>
              <td className={padding}>
                <Tooltip
                  value={
                    plugin.isBuilding
                      ? 'Building'
                      : plugin.isPending
                      ? 'Pending'
                      : 'Draft'
                  }
                >
                  <div
                    className={classNames(
                      'w-4 h-4 rounded-full',
                      plugin.isBuilding
                        ? buildingColor
                        : plugin.isPending
                        ? pendingColor
                        : privateColor,
                    )}
                  />
                </Tooltip>
              </td>
            </tr>
          </Link>
        ))}
      </tbody>
    </table>
  )
}

export default PluginsList
