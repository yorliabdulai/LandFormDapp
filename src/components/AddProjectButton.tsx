import { Plus } from "lucide-react"
import { Link } from "react-router-dom"

export default function AddProjectButton() {
  return (
    <div className="flex justify-end mb-6">
      <Link to="/admin/projects/create">
        <button className="btn btn-success gap-2 rounded-2xl shadow-md">
          <Plus className="w-4 h-4" />
          Add New Project
        </button>
      </Link>
    </div>
  )
}
