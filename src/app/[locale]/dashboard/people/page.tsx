import { getPeople, getPersonTypes } from '@/app/actions/people'
import { PeoplePageClient } from '@/components/people/people-page-client'

export default async function PeoplePage() {
  const people = await getPeople()
  const personTypes = await getPersonTypes()

  return (
    <div className="p-4 md:p-6">
      <PeoplePageClient people={people} personTypes={personTypes} />
    </div>
  )
}