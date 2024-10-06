<?php

namespace App\Repositories;

use App\Models\FileAttachment;

class FileAttachmentRepository
{
    protected $model;

    public function __construct(FileAttachment $fileAttachment)
    {
        $this->model = $fileAttachment;
    }

    public function create(array $data)
    {
        return $this->model->
        create($data);
    }
    public function findByPostId($postId)
    {
        return $this->model->where('post_id', $postId)->get();
    }
    
}
