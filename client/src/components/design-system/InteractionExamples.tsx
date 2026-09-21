'use client';

import { useRef, useState } from 'react';
import { Eye, EyeOff, Mail, Plus, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, IconButton } from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Field';
import { Checkbox, Radio, Switch } from '../ui/Choice';
import { Card, Chip, Divider } from '../ui/Surface';
import { Tabs } from '../ui/Tabs';
import { Modal, Drawer } from '../ui/Dialog';
import { DropdownMenu } from '../ui/DropdownMenu';
import { Tooltip } from '../ui/Tooltip';

export function InteractionExamples() {
  const [selected, setSelected] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [mountedModal, setMountedModal] = useState(false);
  const [notice, setNotice] = useState('No preview action selected.');
  const firstField = useRef<HTMLInputElement>(null);
  const notify = (action: string) => setNotice(`${action} preview selected. No data was sent.`);
  return <div className="space-y-10">
    <section aria-labelledby="actions-title"><p className="preview-eyebrow">05 / Actions</p><h2 id="actions-title" className="text-h2">Purposeful, predictable controls.</h2>
      <div className="mt-6 flex flex-wrap items-center gap-3">{(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map((variant) => <Button key={variant} variant={variant} onClick={() => notify(variant)}>{variant[0].toUpperCase() + variant.slice(1)}</Button>)}</div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button size="sm" onClick={() => notify('Small')}>Small</Button><Button size="md" onClick={() => notify('Medium')}>Medium</Button><Button size="lg" onClick={() => notify('Large')}>Large</Button><Button disabled>Unavailable</Button><Button loading loadingLabel="Saving preview">Save preview</Button><IconButton label="Add preview item" onClick={() => notify('Add')}><Plus size={20} /></IconButton></div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Chip selected={selected} onClick={() => setSelected(!selected)}>Reflection</Chip><Chip disabled>Disabled filter</Chip><Tooltip content="A short, helpful explanation. Keyboard focus works too."><IconButton label="About this preview"><Info size={20} /></IconButton></Tooltip></div>
      <p role="status" className="mt-4 text-caption text-text-muted" data-testid="preview-action-status">{notice}</p>
    </section>
    <section aria-labelledby="fields-title"><p className="preview-eyebrow">06 / Forms</p><h2 id="fields-title" className="text-h2">Make the next step clear.</h2><p className="mt-2 text-body-small text-text-muted">These fields are local examples. They never create an account or save settings.</p>
      <Card className="mt-6"><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); toast.success('Preview complete. No data was sent.'); }}>
        <Input label="Email example" type="email" placeholder="you@example.com" description="Use a sample address for this preview." required leftIcon={<Mail size={18} />} />
        <Input label="Password example" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="A private passphrase" rightAction={<IconButton label={visible ? 'Hide sample password' : 'Show sample password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</IconButton>} />
        <Input label="Validation example" defaultValue="Too short" description="A helpful hint remains available." error="Please use at least 12 characters." />
        <Input label="Disabled input" disabled value="Not editable in this example" />
        <Textarea label="Reflection example" placeholder="What felt like progress today?" description="A quiet moment to put it into words." />
        <Select label="Visibility example" defaultValue="private"><option value="private">Just me</option><option value="community">My community</option></Select>
        <Checkbox label="Sample checkbox" description="Preferences are not saved." />
        <fieldset className="space-y-2"><legend className="mb-2 text-label">Sample rhythm</legend><div className="flex flex-wrap gap-6"><Radio name="rhythm" label="Daily" value="daily" defaultChecked /><Radio name="rhythm" label="Weekly" value="weekly" /><Radio name="rhythm" label="Unavailable rhythm" value="disabled" disabled /></div></fieldset>
        <Switch label="Sample reminders" description="No notifications will be sent." />
        <Divider /><Button type="submit" variant="secondary">Preview form feedback</Button>
      </form></Card>
    </section>
    <section aria-labelledby="overlays-title"><p className="preview-eyebrow">07 / Navigation & feedback</p><h2 id="overlays-title" className="text-h2">Stay oriented.</h2>
      <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => setModal(true)}>Open modal</Button><Button variant="outline" onClick={() => setDrawer(true)}>Open drawer</Button><Button variant="ghost" onClick={() => setMountedModal(true)}>Mount open modal</Button>
        <DropdownMenu label="Preview options" items={[{ id: 'save', label: 'Save example', onSelect: () => notify('Save') }, { id: 'disabled', label: 'Unavailable action', disabled: true, onSelect: () => {} }, { id: 'share', label: 'Share example', onSelect: () => notify('Share') }, { id: 'delete', label: 'Delete example', danger: true, onSelect: () => notify('Delete') }]} />
        <DropdownMenu label="Unavailable options" items={[{ id: 'disabled', label: 'Unavailable action', disabled: true, onSelect: () => {} }]} />
        <Button variant="outline" onClick={() => toast.success('Preview complete. Nothing was saved.')}>Success toast</Button><Button variant="outline" onClick={() => toast.error('Sample error. Please try again.')}>Error toast</Button></div>
      <div className="mt-6"><Tabs label="Example activity tabs" items={[{ id: 'today', label: 'Today', content: <p className="text-body-small">Today’s sample reflection panel.</p> }, { id: 'disabled', label: 'Unavailable', disabled: true, content: null }, { id: 'week', label: 'This week', content: <p className="text-body-small">A weekly view example, ready for real data later.</p> }, { id: 'all', label: 'All time', content: <p className="text-body-small">A longer view example.</p> }]} /></div>
    </section>
    <Modal open={modal} onOpenChange={setModal} title="A moment to reflect" description="This is a modal example. Your text stays in this browser view." initialFocusRef={firstField}>
      <Input ref={firstField} label="A small win" placeholder="Something you showed up for" /><div className="mt-6 flex flex-wrap justify-end gap-3"><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button onClick={() => { setModal(false); notify('Reflection'); }}>Finish preview</Button></div>
    </Modal>
    <Drawer open={drawer} onOpenChange={setDrawer} title="A little more context" description="A side panel on desktop, a bottom sheet on phones."><p className="text-body-small">Use drawers for secondary content. Keep the main task in view.</p><Button className="mt-6" onClick={() => setDrawer(false)}>Close preview drawer</Button></Drawer>
    {mountedModal && <Modal open onOpenChange={setMountedModal} title="Mounted open example"><p className="text-body-small">This also exercises focus restoration when a dialog mounts already open.</p><Button className="mt-6" onClick={() => setMountedModal(false)}>Done</Button></Modal>}
  </div>;
}
