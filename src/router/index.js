import { createRouter, createWebHistory } from 'vue-router'
import WorkTimeQuery from '@/views/WorkTimeQuery.vue'
import RecordTime from '@/views/RecordTime.vue'
import SalaryCalculator from '@/views/SalaryCalculator.vue'
import SalaryCalculator2 from '@/views/SalaryCalculator2.vue'

const routes = [
  {
    path: '/',
    name: 'WorkTimeQuery',
    component: WorkTimeQuery
  },
  {
    path: '/record',
    name: 'RecordTime',
    component: RecordTime
  },
  {
    path: '/salary',
    name: 'SalaryCalculator',
    component: SalaryCalculator
  },
  {
    path: '/salary2',
    name: 'SalaryCalculator2',
    component: SalaryCalculator2
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router