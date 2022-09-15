/*
 * @Author: tohsaka888
 * @Date: 2022-09-05 13:38:42
 * @LastEditors: tohsaka888
 * @LastEditTime: 2022-09-15 10:01:00
 * @Description: 请填写简介
 */
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '@utils/connectDB'
import Cors from 'cors'
import { runMiddleware } from '@utils/runMiddleware'
import { WithId } from 'mongodb'
import moment from 'moment'

/**
 * @openapi
 * /api/activity/search:
 *   post:
 *     description: 获取复合条件活动简单列表
 *     responses:
 *       200:
 *         description: 返回列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: 
 *                   type: boolean
 *                 list: 
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: axxss
 *                       name:
 *                         type: string
 *                         example: 比赛
 *               
 */

const cors = Cors({
  methods: ['POST', 'GET', 'HEAD',],
  origin: '*',
  preflightContinue: true
})

type Query = {
  id?: string;
  name?: string;
  author?: string;
  createdStartTime?: string;
  createdEndTime?: string;
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await runMiddleware(req, res, cors)
    const db = await connectDB()
    const body: Query = req.body

    if (db) {
      const activity = db.collection('activity')
      const activitys: WithId<Activity.Activity>[] = await activity.find<WithId<Activity.Activity>>(
        {
          name: body.name ? eval('/' + body.name + '/i') : /^/,
          // _id: body.id ? '/' + body.id + '/i' : '/^/',
          'author': body.author ? eval('/' + body.author + '/i') : /^/,
        }
      ).toArray()

      const filteredactivitys = activitys.filter(
        (item: Activity.Activity) => {
          const filter1 = body.createdStartTime ? moment(item.createdTime).isAfter(moment(body.createdStartTime)) : true
          const filter2 = body.createdEndTime ? moment(item.createdTime).isBefore(moment(body.createdEndTime)) : true

          return filter1 && filter2
        }
      )
      res.status(200).json({ success: true, list: filteredactivitys })
    } else {
      new Error('连接数据库失败')
    }
  } catch (error) {
    res.status(200).json({ success: false, error: (error as Error).message })
  }
}