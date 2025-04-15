import React from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  imageURL: string;
  title: string;
  location: string;
  pricePerShare: number;
  availableShares: number;
  totalShares: number;
}

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <Link to={`/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
        <img src={project.imageURL} alt={project.title} className="w-full h-48 object-cover" />
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-800">{project.title}</h3>
          <p className="text-gray-500">{project.location}</p>
          <div className="mt-2">
            <span className="text-sm text-green-700 font-semibold">
              {project.pricePerShare} APE
            </span>
            <span className="text-sm text-gray-500 ml-2">
              {project.availableShares}/{project.totalShares} shares left
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
