<?php

namespace Database\Seeders;

final class DemoGoalDataset
{
    public static function rows(array $time): array
    {
        $data = ['goals' => [], 'goal_milestones' => []];
        $definitions = [
            ['Learn Next.js', 'milestone', null, null], ['Read 12 books', 'count', '12.000', 'books'],
            ['Morning exercise', 'count', '20.000', 'sessions'], ['Build my portfolio', 'boolean', null, null],
            ['Meditate consistently', 'duration', '600.000', 'minutes'],
        ];
        foreach ($definitions as $offset => [$title, $type, $target, $unit]) {
            $number = $offset + 1;
            $data['goals'][] = $time + ['id' => DemoDataset::id('goal', $number), 'user_id' => DemoDataset::id('user', $number),
                'title' => $title, 'description' => 'Fictional planning example; no progress activity is generated.',
                'measurement_type' => $type, 'target_value' => $target, 'unit' => $unit, 'target_date' => '2026-12-31',
                'visibility' => $number % 2 ? 'private' : 'public', 'status' => $number === 4 ? 'completed' : ($number === 3 ? 'archived' : 'active'),
                'completed_at' => $number === 4 ? $time['created_at'] : null, 'archived_at' => $number === 3 ? $time['created_at'] : null];
        }
        foreach (['Learn routing', 'Build an accessible form', 'Deploy a practice project'] as $offset => $title) {
            $data['goal_milestones'][] = $time + ['id' => DemoDataset::id('milestone', $offset + 1), 'goal_id' => DemoDataset::id('goal', 1),
                'title' => $title, 'position' => $offset + 1, 'completed_at' => $offset === 0 ? $time['created_at'] : null];
        }

        return $data;
    }
}
